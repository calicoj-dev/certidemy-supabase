-- 365: mcp.concept returns HTTP 500 on every non-English read, and has since 359.
--
-- FOUND BY THE WIRE CHECK, NOT BY THE GATE. The director asked for the cleared
-- rows to be confirmed "on the wire, not what the migration intended". The view
-- reported 158/158 serving. The endpoint reported:
--
--     POST courseware-read {resource: concept, language: es-419}  ->  500
--     courseware-read failed: permission denied for schema public
--
-- 359 put two function calls into the mcp.concept join predicate:
--
--     and ct.en_hash = concept_row_en_hash(co.id)
--     and ct.tr_hash = translation_hash(ct.name, ct.description)      -- 364
--
-- mcp.concept is security_barrier, NOT security_invoker, so its TABLE reads are
-- checked as the view owner. A FUNCTION called inside it runs as the CALLER.
-- mcp_reader holds EXECUTE on both and has no USAGE on schema public, so the
-- call is refused at the schema door before the function ACL is ever consulted.
--
-- WHY ENGLISH KEPT WORKING, which is the reason nobody saw it. There are no
-- concept_translations rows with language 'en'. The LEFT JOIN finds no candidate
-- row, the predicate is never evaluated, and no function is ever called. Every
-- English read passed for the whole life of the defect. The one language that
-- cannot exercise the broken path is the one everything was tested in.
--
-- ============ 361 IS NAMED close_view_function_grant_gap AND REPORTED CLEAN ====
--
-- scripts/sql/check-view-function-grant-gap.sql asks
--
--     not has_function_privilege(r.rolname, p.fn_oid, 'EXECUTE')
--
-- and never asks has_schema_privilege(r.rolname, 'public', 'USAGE'). CLAUDE.md
-- already records that an ACL comparison measures what was TYPED while
-- has_function_privilege measures what is TRUE. This is the next rung down:
-- has_function_privilege is TRUE and the call still fails, because reaching a
-- function is two gates and that function answers for one of them. The gate
-- built to close this exact class of gap was green while the endpoint was down.
--
-- ============ WHY NOT grant usage on schema public to mcp_reader ============
--
-- Measured before choosing, rather than argued:
--
--     public functions executable by PUBLIC              217
--        of those, SECURITY DEFINER (they run as postgres) 16
--     public tables mcp_reader may SELECT today             0
--
-- Schema USAGE is the only thing standing between the partner-facing read role
-- and 217 functions it was never meant to call. The isolation is real and worth
-- keeping. So the call site moves to a schema mcp_reader already reaches.
--
-- The wrappers DELEGATE and do not reimplement. A second hand-written copy of
-- one hash diverges, and the divergence would surface as rows withheld for an
-- arithmetic difference rather than for an edit -- which is the failure this
-- whole gate exists to make impossible.
--
-- ============ SCOPE: ONE VIEW, DELIBERATELY ============
--
-- Three other mcp views call a public function the same way:
--
--     mcp.lesson        lesson_body_is_servable
--     mcp.lesson_index  lesson_body_is_servable
--     mcp.task          task_ksa_is_withheld
--
-- All three answer 200 today, in every language, measured against the endpoint.
-- They are not safe -- they are unexercised: the call sits in a select-list
-- expression the planner is currently pruning, so the gap opens on a planner
-- decision rather than on an edit. That is the "safe because nobody returns it"
-- shape, and it is one query shape away from false.
--
-- They are NOT fixed here. Redefining three working views on the partner path
-- under time pressure is the move CLAUDE.md warns against, and the honest
-- alternative is to make the gap LOUD rather than silently correct: the check
-- script now asks about schema USAGE and reports all three as a gap. A latent
-- defect that an instrument names is a different thing from one nothing can see.

begin;

-- ---------------------------------------------------------------- wrappers

create or replace function mcp.concept_row_en_hash(p_concept_id uuid)
returns text language sql stable security definer set search_path = '' as $fn$
  select public.concept_row_en_hash(p_concept_id)
$fn$;

-- SECURITY DEFINER even though the public original is INVOKER: that original
-- calls public.ksa_en_hash, which mcp_reader also cannot reach.
create or replace function mcp.translation_hash(p_a text, p_b text default null, p_c text default null)
returns text language sql immutable security definer set search_path = '' as $fn$
  select public.translation_hash(p_a, p_b, p_c)
$fn$;

revoke all on function mcp.concept_row_en_hash(uuid) from public;
revoke all on function mcp.translation_hash(text, text, text) from public;
grant execute on function mcp.concept_row_en_hash(uuid) to mcp_reader, mcp_holder;
grant execute on function mcp.translation_hash(text, text, text) to mcp_reader, mcp_holder;

-- ---------------------------------------------------------------- the view
-- Transcribed from pg_get_viewdef, not from migration 364. Two call sites
-- schema-qualified onto mcp; every column name, type and position unchanged,
-- which is what create or replace view requires and what keeps every reader
-- of this view working without a redeploy.

create or replace view mcp.concept with (security_barrier = true) as
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
          and ct.en_hash = mcp.concept_row_en_hash(co.id)
          and ct.tr_hash = mcp.translation_hash(ct.name, ct.description)
   where c.code = any ('{AISM-I,AIE-I,AIHR-I,AIGRM-I,SM-AI-I,SM-AI-II,SPO-AI-I,SD-AI-I,ISMS-F,AIMS-F,AIMS-IA,ISMS-IA}'::text[])
     and co.retired_at is null;

-- ---------------------------------------------------------------- proof

do $post$
declare n_rel int; withheld int; falling_back int;
begin
  -- POSITIVE: the role can now reach both wrappers.
  if not has_function_privilege('mcp_reader', 'mcp.concept_row_en_hash(uuid)'::regprocedure, 'EXECUTE')
     or not has_function_privilege('mcp_reader', 'mcp.translation_hash(text,text,text)'::regprocedure, 'EXECUTE')
     or not has_schema_privilege('mcp_reader', 'mcp', 'USAGE')
  then
    raise exception 'mcp_reader still cannot reach a wrapper';
  end if;

  -- NEGATIVE, and this is the half that matters: the fix must not have widened
  -- the role. If it did, the outage is closed by handing over the very thing
  -- the wrappers exist to avoid handing over.
  if has_schema_privilege('mcp_reader', 'public', 'USAGE') then
    raise exception 'mcp_reader gained USAGE on public'
      using detail = 'the wrappers exist so that this stays false';
  end if;

  select count(*) into n_rel
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('r','v','m')
     and has_table_privilege('mcp_reader', c.oid, 'SELECT');
  if n_rel <> 0 then
    raise exception 'mcp_reader can now select % public relation(s)', n_rel;
  end if;

  -- The view still gates. Not a count: a PROPERTY, both directions. Every
  -- cleared row whose stored hashes match live content must serve its
  -- translation, and every cleared row whose hashes do not must fall back.
  -- A migration that broke the gate OPEN satisfies any assertion written
  -- only about the first half.
  select count(*) into withheld
    from public.concept_translations ct
    join public.concepts co on co.id = ct.concept_id
   where co.retired_at is null
     and ct.is_provisional = false
     and (ct.en_hash is distinct from public.concept_row_en_hash(co.id)
       or ct.tr_hash is distinct from public.translation_hash(ct.name, ct.description));

  select count(*) into falling_back
    from mcp.concept v
    join public.certifications c2 on c2.code = v.certification
    join public.concepts co on co.slug = v.slug and co.certification_id = c2.id
   where v.language <> 'en'
     and v.description_is_fallback
     and exists (select 1 from public.concept_translations ct
                  where ct.concept_id = co.id
                    and ct.language = v.language
                    and ct.is_provisional = false);

  if falling_back <> withheld then
    raise exception 'the gate disagrees with itself'
      using detail = 'cleared rows falling back: ' || falling_back
                     || ', cleared rows with a stale hash: ' || withheld,
            hint   = 'these must be the same rows; if they are not, the predicate changed meaning';
  end if;

  raise notice 'mcp.concept rebuilt. % cleared row(s) correctly withheld on a stale hash.', withheld;
end $post$;

commit;
