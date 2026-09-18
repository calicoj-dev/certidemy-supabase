-- 346_mcp_task_criticality.sql
--
-- Add `criticality` to mcp.task. Both arms of the union.
--
-- ============ WHAT IS MISSING ============
--
-- public.tasks.criticality is fully populated -- 509 of 509, 389 high, 118
-- medium, 2 low, zero nulls -- and /our-standard renders it beside statement,
-- KSA and Bloom level. mcp.task has never selected it, so a model that read the
-- published specimen and then called explain_task found the field gone.
--
-- The web half is already shipped and inert, by design: registry.ts spreads it
-- conditionally (`...(t.criticality == null ? {} : ...)`) so its absence is not
-- a claim, and TASK_OUTPUT_SCHEMA declares it because that schema is
-- additionalProperties:false -- an undeclared field arriving would be a
-- contract breach rather than a bonus. Both are waiting on this view.
--
-- ============ BOTH ARMS, AND WHY THAT IS THE WHOLE RISK ============
--
-- mcp.task is a UNION: an English arm reading public.tasks directly, and a
-- translated arm joining task_translations. `criticality` is a property of the
-- TASK, not of the translation, so it comes from `t.` in both -- but adding it
-- to one arm only would make the field appear in English and vanish in Spanish
-- and Portuguese.
--
-- That is worse than absent. Absent is uniform and a caller codes for it; a
-- field that is present in one language and missing in another reads as a data
-- gap in the translation, and the caller goes looking for a translation defect
-- that does not exist. The post-conditions below therefore assert es-419 and
-- pt-BR explicitly, not just that the column exists.
--
-- ============ APPENDED, NOT INSERTED, AND THAT IS DELIBERATE ============
--
-- The request was to place it after t.bloom_level. It goes at the END of both
-- select lists instead, because `create or replace view` may ADD columns to the
-- end and may not insert one in the middle -- that needs DROP + CREATE, which
-- silently takes the view's GRANTS and COMMENT with it. 325, 328, 333, 334, 337
-- and 342 all had to restate them, and mcp.task is granted to mcp_reader and
-- mcp_holder.
--
-- Column ORDER in this view is invisible to every consumer: courseware-read's
-- buildQuery selects by name. So the position buys nothing and the drop risks
-- the paywall. 338 and 339 both appended ksa_withheld the same way.
--
-- ============ THE BODY IS 339's, WITH ONE COLUMN ADDED PER ARM ============
--
-- Lifted from 339 rather than retyped. The translated arm's `cross join lateral
-- (select public.task_ksa_is_withheld(tt.id) as w) kw` is 339's KSA gate and
-- 341's SECURITY DEFINER fix depends on it; retyping this view is how that goes
-- missing, and losing it would serve every unreviewed KSA translation on the
-- platform.
--
-- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  allowed text[] := array['AISM-I','AIE-I','AIHR-I','AIGRM-I',
                          'SM-AI-I','SM-AI-II','SPO-AI-I','SD-AI-I',
                          'ISMS-F','AIMS-F','AIMS-IA','ISMS-IA'];
  n_base_en   int;
  n_view_en   int;
  n_null      int;
  n_es        int;
  n_pt        int;
  n_mismatch  int;
  n_withheld  int;
begin

  -- ----------------------------------------------- pre-conditions
  -- The column must be populated before it is published. A view that serves
  -- nulls to a caller who was told the field exists is the shape this repo
  -- calls a promise.
  select count(*) into n_null from public.tasks where criticality is null;
  if n_null <> 0 then
    raise exception '% task(s) have a null criticality', n_null
      using hint = 'Populate before publishing; an optional-looking field that is sometimes null is worse than an absent one.';
  end if;

  select count(*) into n_base_en
    from public.tasks t
    join public.certifications c on c.id = t.certification_id
   where c.code = any (allowed);
  if n_base_en = 0 then
    raise exception 'no tasks on the served certifications -- refusing to rebuild the view against nothing';
  end if;

  -- ----------------------------------------------- the view
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
           false as ksa_withheld,
           t.criticality
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
           coalesce(kw.w, false) as ksa_withheld,
           t.criticality
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

  -- `create or replace` keeps the grants and the comment. Asserted below rather
  -- than assumed, because "it should have kept them" is how a paywall opens.

  -- ===================== POST-CONDITIONS =====================
  --
  -- AS mcp_reader. 339 asserted this same family of property as a superuser and
  -- took explain_task down in two languages for two hours.

  -- 1. ENGLISH. Every row carries it, and the count is derived from the base
  --    table rather than from a number written here.
  execute 'set local role mcp_reader';
  select count(*), count(*) filter (where criticality is null)
    into n_view_en, n_null
    from mcp.task where language = 'en';
  execute 'reset role';
  if n_view_en <> n_base_en then
    raise exception 'mcp.task returns % English row(s) against % task(s)', n_view_en, n_base_en;
  end if;
  if n_null <> 0 then
    raise exception '% English row(s) carry a null criticality', n_null;
  end if;

  -- 2. THE HALF THAT WAS ASKED FOR: BOTH TRANSLATED LANGUAGES. A field added to
  --    one arm passes check 1 and fails here.
  execute 'set local role mcp_reader';
  select count(*) filter (where language = 'es-419' and criticality is not null),
         count(*) filter (where language = 'pt-BR'  and criticality is not null),
         count(*) filter (where language <> 'en' and criticality is null)
    into n_es, n_pt, n_null
    from mcp.task;
  execute 'reset role';
  if n_es = 0 or n_pt = 0 then
    raise exception 'criticality is missing from a translated arm: es-419 % row(s), pt-BR % row(s)', n_es, n_pt
      using detail = 'Present in English and absent in a translation reads as a translation defect that does not exist.';
  end if;
  if n_null <> 0 then
    raise exception '% non-English row(s) carry a null criticality', n_null;
  end if;
  raise notice 'ok: criticality on % es-419 and % pt-BR row(s)', n_es, n_pt;

  -- 3. AND IT IS THE TASK'S VALUE, NOT A JOIN ARTEFACT. criticality belongs to
  --    the task, so every translated row must equal its English sibling. A
  --    fan-out or a mis-joined alias would show up here and nowhere else.
  execute 'set local role mcp_reader';
  select count(*) into n_mismatch
    from mcp.task x
    join mcp.task e on e.certification = x.certification
                   and e.task_code = x.task_code
                   and e.language = 'en'
   where x.language <> 'en'
     and x.criticality is distinct from e.criticality;
  execute 'reset role';
  if n_mismatch <> 0 then
    raise exception '% translated row(s) disagree with their English sibling on criticality', n_mismatch;
  end if;

  -- 4. NEGATIVE HALF. The KSA gate survived the rebuild. Asserted as a
  --    WITHHOLDING, because a positive check passes either way -- and a view
  --    retyped without the lateral join would serve every unreviewed KSA
  --    translation on the platform.
  execute 'set local role mcp_reader';
  select count(*) into n_withheld
    from mcp.task
   where language <> 'en' and ksa_withheld
     and (knowledge is not null or skills is not null or abilities is not null);
  execute 'reset role';
  if n_withheld <> 0 then
    raise exception '% withheld row(s) still carry KSA text -- 339 gate lost', n_withheld;
  end if;

  -- 5. AND THE PAYWALL. `create or replace` should keep the grants; prove it.
  if has_table_privilege('mcp_reader', 'mcp.lesson', 'SELECT') then
    raise exception 'mcp_reader can select mcp.lesson -- the paywall is open';
  end if;
  if not has_table_privilege('mcp_reader', 'mcp.task', 'SELECT') then
    raise exception 'mcp_reader lost SELECT on mcp.task';
  end if;

  raise notice '346 ok: criticality on % en, % es-419, % pt-BR row(s)', n_view_en, n_es, n_pt;
  raise notice 'NEXT: courseware-read must SELECT it -- buildQuery names columns explicitly.';
end
$mig$;
