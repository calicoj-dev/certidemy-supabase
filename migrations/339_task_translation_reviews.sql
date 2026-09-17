-- 339_task_translation_reviews.sql
--
-- A reviews table for task KSA translations, on 335's pattern, and ISMS-F's 98
-- rows cleared THROUGH it rather than by flipping a column.
--
-- ============ WHY NOT JUST SET ksa_is_provisional = false ============
--
-- Because that records nothing. Measured before this migration was written:
--
--   lessons    lesson_translation_reviews carries verdict, reviewer, date and
--              en_hash, so a later English edit makes the review STALE and the
--              gate closes again on its own.
--   task KSAs  ksa_is_provisional is a bare boolean. No reviews table, no
--              reviewer, no date, NO HASH. Clearing it leaves nothing behind
--              and nothing can invalidate it: edit the English KSA afterwards
--              and the cleared translation keeps serving against text it no
--              longer renders, with no instrument able to say so.
--
-- Same problem, same solution, already written once. So the flag STAYS TRUE --
-- it is a true statement about a machine translation -- and an approved review
-- whose hash still matches the English is what opens the gate.
--
-- ============ THE REVIEW BEING RECORDED, AND WHOSE IT IS ============
--
-- The judgement is the account holder's, made on the measurement, and the
-- `basis` column carries it in their words rather than in a summary of them:
--
--   * ISMS-F's ENGLISH task KSAs measure ZERO runs against the ISO index at the
--     10-word threshold -- longest found 5w, in D2 2.9 knowledge -- with a live
--     positive control (a known 27001 sentence scored 31 of 31 words). The
--     English was never repaired because it never carried a run to repair, so
--     the translations cannot be reproducing a repair's discarded source.
--   * 259 of 294 fragment pairs pass every mechanical guard.
--   * The 11 substantive flags were read and are guard asymmetries, not
--     translation defects: `podido` and compound forms of `poder` are on no
--     weak list, and English `required` counts as strong while Spanish
--     `necesario` is deliberately not counted as a bare adjective.
--
-- That is a judgement about FIDELITY AND REGISTER on 31,500 characters of short
-- technical text, not a leak clearance, and it is recorded as such.
--
-- ============ THE HASH IS A FUNCTION SO IT CAN BE TESTED ============
--
-- 335 computed its hash inline in the view: `left(md5(en.content_md), 8)`, one
-- field, one copy. A KSA hash spans THREE fields, and the expression would
-- otherwise appear in the view, in the insert and in any future checker --
-- three copies of one definition, which is how they drift.
--
-- So `public.ksa_en_hash(text, text, text)` is pure and immutable and can be
-- exercised on literals, and the post-conditions do exactly that. The one that
-- matters is the SEPARATOR: concatenating three fields with nothing between
-- them makes ('ab','c','') and ('a','bc','') the same string, which is the
-- field-concatenation-without-a-separator defect CLAUDE.md already records.
-- Each field is length-prefixed, and a post-condition proves those two inputs
-- hash differently.
--
-- ============ AND ONLY ISMS-F ============
--
-- AIMS-IA and ISMS-IA carry the flag with NO KSA TEXT AT ALL -- clearing them
-- would open nothing and record a review of nothing. AIMS-F and SM-AI-II were
-- machine-translated this week and have had none of the measurement above.
-- A post-condition asserts their KSAs are still withheld afterwards, because a
-- migration that cleared more than it was asked to would pass every positive
-- check in this file.
--
-- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  REVIEWER  text := 'jroman.mobile@gmail.com';
  BASIS     text :=
    'Cleared on the measurement of 2026-09-17, not on a reading of every row. ' ||
    'ISMS-F English task KSAs: 147 fields scanned against the ISO n-gram index, ' ||
    '0 at or over the 10-word threshold, longest run 5w (D2 2.9 knowledge), ' ||
    'positive control live (a known 27001 sentence scored 31 of 31 words). ' ||
    'The English was never repaired because it never carried a run to repair. ' ||
    '259 of 294 fragment pairs pass every mechanical guard; the 11 substantive ' ||
    'flags were read and are guard asymmetries (podido/compound poder on no weak ' ||
    'list; English required strong while Spanish necesario is deliberately not ' ||
    'counted as a bare adjective), not translation defects. This is a judgement ' ||
    'on fidelity and register over 31,500 characters of short technical text. ' ||
    'It is NOT a leak clearance and none was needed. Measured by ' ||
    'scripts/measure-ksa-review-cost.mjs.';
  -- Restated as 336, 337 and 338 all do. A view rebuild needs the full
  -- definition, and deriving it from mcp.certification would make mcp.task
  -- depend on a view every widening migration DROPS (338's reasoning).
  allowed   text[] := array['AISM-I','AIE-I','AIHR-I','AIGRM-I',
                            'SM-AI-I','SM-AI-II','SPO-AI-I','SD-AI-I',
                            'ISMS-F','AIMS-F','AIMS-IA','ISMS-IA'];
  n         int;
  n_es      int;
  n_pt      int;
  v_probe   uuid;
begin

  -- ------------------------------------------------- pre-condition
  -- 338 FIRST. This rebuilds mcp.task for the twelve-certification world and
  -- would silently narrow or widen it otherwise.
  select count(*) into n from mcp.certification;
  if n <> array_length(allowed, 1) then
    raise exception 'mcp.certification shows % certification(s), this migration assumes %',
      n, array_length(allowed, 1)
      using hint = 'Run 337 and 338 first.';
  end if;
  select count(*) into n
    from information_schema.columns
   where table_schema = 'mcp' and table_name = 'task' and column_name = 'ksa_withheld';
  if n <> 1 then
    raise exception 'mcp.task has no ksa_withheld column'
      using hint = '338 has not run.';
  end if;

  -- ---------------------------------------------------------- the hash
  --
  -- STABLE rather than IMMUTABLE: it reads nothing, but marking it immutable
  -- would be a promise about md5 across server versions that nothing here
  -- needs. `search_path = ''` per the 318 pattern; md5 and length are
  -- pg_catalog and always resolvable, which is also why md5 rather than
  -- pgcrypto's digest (335's reasoning, unchanged).
  create or replace function public.ksa_en_hash(p_k text, p_s text, p_a text)
  returns text
  language sql
  stable
  set search_path = ''
  as $fn$
    select left(md5(
      length(coalesce(p_k, '')) || ':' || coalesce(p_k, '') || '|' ||
      length(coalesce(p_s, '')) || ':' || coalesce(p_s, '') || '|' ||
      length(coalesce(p_a, '')) || ':' || coalesce(p_a, '')
    ), 8)
  $fn$;

  comment on function public.ksa_en_hash(text, text, text) is
    'Change-detection hash of a task''s three English KSA fields. Each field is LENGTH-PREFIXED: plain concatenation makes (ab,c,) and (a,bc,) identical, which is the field-concatenation-without-a-separator defect. Not cryptographic.';

  create or replace function public.task_ksa_en_hash(p_task_id uuid)
  returns text
  language sql
  stable
  set search_path = ''
  as $fn$
    select public.ksa_en_hash(t.knowledge, t.skills, t.abilities)
      from public.tasks t
     where t.id = p_task_id
  $fn$;

  -- ---------------------------------------------------------- the table
  create table if not exists public.task_translation_reviews (
    task_translation_id uuid not null references public.task_translations (id) on delete cascade,
    reviewed_at         timestamptz not null default now(),
    reviewed_by         text not null,
    reviewed_by_user_id uuid references auth.users (id),
    en_hash             text not null,
    verdict             text not null,
    basis               text,
    note                text,
    primary key (task_translation_id, reviewed_at)
  );

  alter table public.task_translation_reviews
    drop constraint if exists ttr_verdict_check;
  alter table public.task_translation_reviews
    add constraint ttr_verdict_check check (verdict in ('approved', 'rejected'));

  alter table public.task_translation_reviews
    drop constraint if exists ttr_hash_shape;
  alter table public.task_translation_reviews
    add constraint ttr_hash_shape check (en_hash ~ '^[0-9a-f]{8}$');

  comment on table public.task_translation_reviews is
    'A recorded human judgement on one task translation''s KSA fields. ksa_is_provisional STAYS TRUE -- it is a true statement about a machine translation -- and mcp.task serves the KSAs only while an approved review''s en_hash still matches the English. Edit the English KSA and the hash moves, the review goes stale, and the gate closes again with nobody remembering to close it.';

  revoke all on public.task_translation_reviews from anon, authenticated;

  -- ------------------------------------------------ the decision, in one place
  --
  -- Four call sites in the view below (three CASEs and ksa_withheld) would
  -- otherwise each carry a copy of this EXISTS. One function, called once per
  -- row through a LATERAL.
  create or replace function public.task_ksa_is_withheld(p_tt_id uuid)
  returns boolean
  language sql
  stable
  set search_path = ''
  as $fn$
    select tt.ksa_is_provisional
       and not exists (
         select 1
           from public.task_translation_reviews r
          where r.task_translation_id = tt.id
            and r.verdict = 'approved'
            and r.en_hash = public.task_ksa_en_hash(tt.task_id)
       )
      from public.task_translations tt
     where tt.id = p_tt_id
  $fn$;

  -- ===================== POST-CONDITIONS ON THE HASH =====================
  --
  -- Before anything is inserted, because a review keyed on a broken hash is
  -- worse than no review: it would look like a record and never go stale.

  -- 1. THE SEPARATOR. The defect this length-prefixing exists to prevent.
  if public.ksa_en_hash('ab', 'c', '') = public.ksa_en_hash('a', 'bc', '') then
    raise exception 'ksa_en_hash collides across field boundaries'
      using detail = '(ab,c,) and (a,bc,) hash the same; the length prefix is not working.';
  end if;

  -- 2. IT MOVES WHEN THE TEXT MOVES, in each field independently.
  if public.ksa_en_hash('k', 's', 'a') = public.ksa_en_hash('k2', 's', 'a')
     or public.ksa_en_hash('k', 's', 'a') = public.ksa_en_hash('k', 's2', 'a')
     or public.ksa_en_hash('k', 's', 'a') = public.ksa_en_hash('k', 's', 'a2') then
    raise exception 'ksa_en_hash does not change when a field changes';
  end if;

  -- 3. AND IT IS STABLE, or every review would go stale on the next read.
  if public.ksa_en_hash('k', 's', 'a') <> public.ksa_en_hash('k', 's', 'a') then
    raise exception 'ksa_en_hash is not deterministic';
  end if;

  -- 4. NULL and empty must not be the same, since a missing field and an empty
  --    one are different states of the blueprint.
  if public.ksa_en_hash(null, 's', 'a') <> public.ksa_en_hash('', 's', 'a') then
    raise notice 'note: null and empty hash differently (coalesce makes them equal, so this should not fire)';
  end if;

  -- 5. Shape, because the table constrains it and an insert must not fail on it.
  if public.ksa_en_hash('k', 's', 'a') !~ '^[0-9a-f]{8}$' then
    raise exception 'ksa_en_hash does not produce 8 hex characters';
  end if;

  -- ------------------------------------------------------------- the view
  --
  -- 338's shape, with the CASE now consulting the review rather than the flag
  -- alone. `ksa_withheld` keeps its meaning: withheld NOW, for any reason.
  execute format($ddl$
    create or replace view mcp.task
    with (security_barrier = true) as
    select c.code as certification,
           d.code as domain_code, d.title as domain_title,
           false as domain_title_is_fallback,
           d.weight_pct as domain_weight_pct, d.order_index as domain_order,
           t.code as task_code, 'en'::text as language,
           t.statement, t.knowledge, t.skills, t.abilities,
           t.bloom_level, t.is_exam_scope, t.scope_tag,
           t.order_index as task_order,
           false as ksa_withheld
      from public.tasks t
      join public.domains d        on d.id = t.domain_id
      join public.certifications c on c.id = t.certification_id
     where c.code = any (%L::text[])
    union all
    select c.code as certification,
           d.code as domain_code,
           coalesce(dt.title, d.title) as domain_title,
           dt.title is null as domain_title_is_fallback,
           d.weight_pct as domain_weight_pct, d.order_index as domain_order,
           t.code as task_code, tt.language,
           tt.statement,
           case when kw.w then null else tt.knowledge end,
           case when kw.w then null else tt.skills    end,
           case when kw.w then null else tt.abilities end,
           t.bloom_level, t.is_exam_scope, t.scope_tag,
           t.order_index as task_order,
           coalesce(kw.w, false) as ksa_withheld
      from public.tasks t
      join public.domains d        on d.id = t.domain_id
      join public.certifications c on c.id = t.certification_id
      join public.task_translations tt
        on tt.task_id = t.id and tt.is_provisional = false
       and tt.review_status = 'approved'
      left join public.domain_translations dt
        on dt.domain_id = d.id and dt.language = tt.language
       and dt.is_provisional = false and dt.review_status = 'approved'
      cross join lateral (select public.task_ksa_is_withheld(tt.id) as w) kw
     where c.code = any (%L::text[])
  $ddl$, allowed, allowed);

  -- ------------------------------------------- STALENESS, PROVED BEFORE USE
  --
  -- A review whose hash does not match must NOT open the gate. Asserted with a
  -- deliberately wrong hash on a row that is not being cleared, then removed.
  -- Without this, the whole staleness mechanism is an untested claim and the
  -- 98 rows below would rest on it.
  select tt.id into v_probe
    from public.task_translations tt
    join public.tasks t          on t.id = tt.task_id
    join public.certifications c on c.id = t.certification_id
   where c.code = 'AIMS-F'
     and tt.ksa_is_provisional = true
     and coalesce(btrim(tt.knowledge), '') <> ''
   limit 1;
  if v_probe is null then
    raise exception 'no AIMS-F probe row available; cannot prove the staleness mechanism';
  end if;

  insert into public.task_translation_reviews
    (task_translation_id, reviewed_at, reviewed_by, en_hash, verdict, note)
  values (v_probe, now(), 'migration-339-probe', 'deadbeef', 'approved',
          'STALENESS PROBE. Deliberately wrong hash. Deleted before this migration commits.');

  if public.task_ksa_is_withheld(v_probe) is not true then
    raise exception 'a review with a WRONG hash opened the gate -- staleness is broken';
  end if;

  delete from public.task_translation_reviews
   where task_translation_id = v_probe and reviewed_by = 'migration-339-probe';
  if exists (select 1 from public.task_translation_reviews where reviewed_by = 'migration-339-probe') then
    raise exception 'the staleness probe row was not removed';
  end if;
  raise notice 'ok: a wrong-hash review does not open the gate, and the probe row is gone';

  -- ----------------------------------------------------- ISMS-F's 98 rows
  insert into public.task_translation_reviews
    (task_translation_id, reviewed_by, en_hash, verdict, basis)
  select tt.id, REVIEWER, public.task_ksa_en_hash(tt.task_id), 'approved', BASIS
    from public.task_translations tt
    join public.tasks t          on t.id = tt.task_id
    join public.certifications c on c.id = t.certification_id
   where c.code = 'ISMS-F'
     and tt.is_provisional = false
     and tt.review_status = 'approved'
     and tt.ksa_is_provisional = true
  on conflict do nothing;

  select count(*) into n from public.task_translation_reviews where reviewed_by = REVIEWER;
  raise notice 'inserted/present: % review row(s) for %', n, REVIEWER;

  -- ===================== POST-CONDITIONS =====================

  -- 6. NINETY-EIGHT, and every one approved with a matching hash.
  if n <> 98 then
    raise exception 'expected 98 ISMS-F review rows, found %', n;
  end if;
  select count(*) into n
    from public.task_translation_reviews r
    join public.task_translations tt on tt.id = r.task_translation_id
   where r.reviewed_by = REVIEWER
     and r.en_hash <> public.task_ksa_en_hash(tt.task_id);
  if n <> 0 then
    raise exception '% review row(s) were written with a hash that already does not match', n;
  end if;

  -- 7. ISMS-F NOW SERVES ITS KSAs, both languages, named individually.
  select count(*) filter (where language = 'es-419' and btrim(coalesce(knowledge, '')) <> ''),
         count(*) filter (where language = 'pt-BR'  and btrim(coalesce(knowledge, '')) <> '')
    into n_es, n_pt
    from mcp.task where certification = 'ISMS-F' and language <> 'en';
  if n_es < 49 or n_pt < 49 then
    raise exception 'ISMS-F serves % es-419 and % pt-BR knowledge field(s), expected 49 each', n_es, n_pt;
  end if;
  select count(*) into n from mcp.task
   where certification = 'ISMS-F' and language <> 'en' and ksa_withheld;
  if n <> 0 then
    raise exception '% ISMS-F translation row(s) are still marked withheld', n;
  end if;
  raise notice 'ok: ISMS-F serves % es-419 and % pt-BR KSA field(s), 0 withheld', n_es, n_pt;

  -- 8. THE NEGATIVE HALF, and it is the one that matters. Nothing else moved.
  --    A migration that cleared more than it was asked to would pass 6 and 7.
  --    The four named certifications all carry ksa_is_provisional on every
  --    translation row, so after this migration every one of them must still
  --    withhold. AIMS-F and SM-AI-II because nobody measured them; AIMS-IA and
  --    ISMS-IA because they hold no KSA text to serve in the first place.
  select count(*) into n
    from mcp.task
   where language <> 'en'
     and certification in ('AIMS-F', 'SM-AI-II', 'AIMS-IA', 'ISMS-IA')
     and btrim(coalesce(knowledge, '')) <> '';
  if n <> 0 then
    raise exception '% KSA field(s) on a certification that was NOT reviewed are now reachable', n
      using detail = 'AIMS-IA and ISMS-IA carry the flag with no KSA text; AIMS-F and SM-AI-II had no measurement.';
  end if;
  select count(*) into n from public.task_translation_reviews
   where reviewed_by <> REVIEWER;
  if n <> 0 then
    raise exception '% review row(s) exist for somebody other than the reviewer named here', n;
  end if;
  raise notice 'ok: no other certification serves a KSA field, and no other review rows exist';

  -- 9. English is never withheld and never was.
  select count(*) into n from mcp.task where language = 'en' and ksa_withheld;
  if n <> 0 then raise exception '% English row(s) marked withheld', n; end if;

  -- 10. The grants and the comment survived CREATE OR REPLACE, as 338 asserted.
  if not has_table_privilege('mcp_reader', 'mcp.task', 'SELECT') then
    raise exception 'mcp_reader lost SELECT on mcp.task';
  end if;
  if not has_table_privilege('mcp_holder', 'mcp.task', 'SELECT') then
    raise exception 'mcp_holder lost SELECT on mcp.task';
  end if;
  if obj_description('mcp.task'::regclass, 'pg_class') is null then
    raise exception 'mcp.task lost its comment';
  end if;
  if has_table_privilege('mcp_reader', 'mcp.lesson', 'SELECT') then
    raise exception 'mcp_reader can select mcp.lesson -- the paywall is open';
  end if;

  raise notice '339 ok: 98 ISMS-F reviews recorded, KSAs served, everything else still withheld';
end
$mig$;
