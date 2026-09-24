-- 371 -- the gate reports WHICH arm withheld a row.
--
-- ############ 177 OF 183 REFUSALS NAME THE WRONG REASON ############
--
-- `get_lesson` refuses a withheld body with:
--
--   "It reproduces clause text from an ISO standard, which Certidemy may teach
--    from but may not redistribute."
--
-- Measured 2026-09-24 against every withheld row in mcp.lesson_index, with
-- each arm's predicate lifted from pg_proc rather than from this folder:
--
--   withheld rows                                183
--   genuinely withheld by the ISO scanner          6
--   withheld by the TRANSLATION REVIEW arm       177   <- told the ISO reason
--   withheld by 367's provenance arm               0
--
-- **That is a false statement about our own curriculum, made to a paying
-- partner, on the one subject where the business depends on being believed.**
-- A partner reading it learns that Certidemy's Portuguese reproduces ISO text.
-- It does not: `aims-ia-01-02` pt-BR has an ISO run of FIVE words, half the
-- floor, and is held only because nobody has reviewed the translation yet.
--
-- ############ THE THIRD BRANCH EXISTS AND IS UNREACHABLE ############
--
-- `courseware-read` already has the right three states. Its comment reasons:
--
--   no index row          -> the lesson genuinely does not exist
--   body_available false  -> the body reproduces standard text
--   body_available true   -> mcp.lesson still refused it, which after 335 can
--                            only mean this TRANSLATION is unreviewed
--
-- The third line assumes `body_available` reflects the ISO scanner alone. It
-- does not: `mcp.lesson_index.body_available` is `lesson_body_is_servable()`,
-- which ANDs the scanner, the review arm and 367's provenance arm. So
-- "body_available true AND mcp.lesson refused" cannot happen -- both read the
-- same function -- and the branch written for the common case is DEAD CODE
-- while every row falls into the branch written for the rare one.
--
-- A three-state discriminator whose third state is unreachable is a two-state
-- one that reports the wrong state, and this file already records that shape
-- under CONTIGUOUS/INTERPOLATED/CHAINED.
--
-- ############ ONE PREDICATE, NOT TWO ############
--
-- The obvious fix -- write a reason function beside the verdict function -- is
-- the `mcp_servable` defect in advance: two implementations of one rule, drifting
-- the first time either is edited, and the drift surfacing as a row refused for
-- a reason that is not why it was refused.
--
-- So the REASON is the primary, and the VERDICT is derived from it:
--
--   mcp.lesson_withholding_reason(id) -> text, null when servable
--   public.lesson_body_is_servable(id) -> reason IS NULL
--
-- They cannot disagree, because there is nothing to disagree with.
--
-- ############ ORDER, AND WHY THIS ONE IS SAFE ############
--
-- The view gains a COLUMN. CLAUDE.md records that a view change has a
-- live-defect window in both deploy orders -- but that rule is about a change
-- that multiplies ROWS. Adding a column is safe view-first: the deployed
-- function does not select it and cannot notice. Function-first would 400.
--
-- So: this migration, then the function deploy. Row count is asserted unchanged
-- below regardless, because "adding a column cannot change the row count" is
-- exactly the kind of reasoning that has been wrong here before.

-- ############ ATTEMPT 1 ABORTED, 2026-09-24, AND NOTHING CHANGED ############
--
-- Reported as applied; `pg_catalog` said otherwise -- no function, no column,
-- `lesson_body_is_servable` byte-for-byte the pre-371 body. The cause is inside
-- this file and is recorded at the revoke below: schema `mcp` has no
-- `pg_default_acl` entry, so the new function was created EXECUTE-to-PUBLIC and
-- the reachability post-condition refused it.
--
-- **Three instruments agreed before anything was re-run** -- the fingerprint,
-- the deploy precondition and `pg_catalog` -- which is the only reason this was
-- a round trip rather than a deploy against a schema that never moved.
--
-- The assertion did its job. A migration that aborts against a correct database
-- is the expensive kind; this one aborted against an over-grant it was about to
-- create.

do $mig$
declare
  v_before jsonb;
  v_moved  int;
  v_who    text;
  v_rows_before int;
  v_rows_after  int;
  v_iso    int;
  v_review int;
  v_prov   int;
  v_acl_view text;
  v_acl_fn   text;
  v_acl_now  text;
  v_role     text;
begin
  select count(*) into v_rows_before from mcp.lesson_index;

  -- Reachability, captured before: who can read the view, and who can call the
  -- function it delegates to. Asserted unchanged at the end. A SET, not a
  -- count -- a count cannot be reconciled across states and a name can.
  select string_agg(r.rolname, ', ' order by r.rolname) into v_acl_view
    from pg_roles r where has_table_privilege(r.oid, 'mcp.lesson_index'::regclass, 'SELECT');
  select string_agg(r.rolname, ', ' order by r.rolname) into v_acl_fn
    from pg_roles r, pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'lesson_body_is_servable'
     and has_function_privilege(r.oid, p.oid, 'EXECUTE');
  select jsonb_object_agg(l.id::text, public.lesson_body_is_servable(l.id))
    into v_before from public.lessons l;

  -- 1. THE REASON. Every clause here is lifted from lesson_body_is_servable as
  --    it stood; nothing is re-derived. Order matters only for reporting -- a
  --    row can be held by more than one arm, and the scanner is named first
  --    because it is the only one that is about the CONTENT rather than about
  --    its review state.
  execute $fn$
    create or replace function mcp.lesson_withholding_reason(p_lesson_id uuid)
     returns text
     language sql
     stable security definer
     set search_path to ''
    as $body$
      select case
        -- The ISO leak scanner. THE ONLY ARM THAT MAY BE REPORTED AS
        -- REPRODUCTION, because it is the only one that measured any.
        when not l.mcp_servable then 'iso_reproduction'

        -- The translation review arm.
        when l.language <> 'en'
         and l.mcp_translation_review_required
         and not exists (
           select 1
             from public.lesson_translation_reviews r
             join public.lessons en
               on en.lesson_group_id = l.lesson_group_id
              and en.language = 'en'
            where r.lesson_id = l.id
              and r.verdict = 'approved'
              and r.en_hash = left(md5(en.content_md), 8)
              and r.tr_hash = public.translation_hash(l.content_md)
         ) then 'translation_review'

        -- 367's provenance arm. NULL is NOT ESTABLISHED and is not a reason.
        when l.language <> 'en'
         and l.en_content_hash is not null
         and l.en_content_hash <> (
              select public.translation_hash(en2.content_md)
                from public.lessons en2
               where en2.lesson_group_id = l.lesson_group_id
                 and en2.language = 'en'
               limit 1
            ) then 'provenance_stale'

        else null
      end
        from public.lessons l
       where l.id = p_lesson_id
    $body$;
  $fn$;

  comment on function mcp.lesson_withholding_reason(uuid) is
    'Which arm withholds this lesson body, or NULL if none does. THE PRIMARY: '
    'public.lesson_body_is_servable is derived from it, so a reason and a verdict '
    'cannot drift apart. Only iso_reproduction may be reported to a caller as '
    'reproduction -- 177 of 183 refusals once said so wrongly.';

  -- ############ REVOKE FROM PUBLIC BEFORE GRANTING TO ANYONE ############
  --
  -- **THE FIRST ATTEMPT AT THIS MIGRATION ABORTED HERE, AND THE ASSERTION IS
  -- WHAT CAUGHT IT.** There is NO `pg_default_acl` entry for schema `mcp`, so a
  -- newly created function there gets `proacl = NULL` -- PostgreSQL's built-in
  -- default, which is **EXECUTE TO PUBLIC**. `create or replace` preserves the
  -- ACL of a function that already exists and grants the default to one that
  -- does not, so this only bites on first creation, which is exactly when
  -- nobody is looking for it.
  --
  -- The post-condition below compares the new function's caller set against the
  -- outgoing one: 36 roles against 7. It fired, the transaction rolled back,
  -- and the database was left correct. That is the both-directions rule paying
  -- for itself -- the positive half (the declared roles can call it) would have
  -- passed cleanly while `anon` held EXECUTE.
  --
  -- Six of the seven existing `mcp` functions have PUBLIC revoked, so this is
  -- the house convention rather than a new precaution. (`mcp.feature_status` is
  -- the seventh and anon CAN call it -- noted, not changed here.)
  execute 'revoke all on function mcp.lesson_withholding_reason(uuid) from public';

  -- THE GRANT SET IS DERIVED, NEVER TYPED. `mcp.lesson_index` gains a call to
  -- a NEW function, and 365 is the precedent: it granted its wrappers to the
  -- two roles somebody had in mind and silently took the view away from the two
  -- that held the originals. Hand-typing `mcp_reader, mcp_holder` here would
  -- have done exactly that again -- SEVEN roles hold EXECUTE on the outgoing
  -- function, including supabase_read_only_user and supabase_etl_admin.
  for v_role in
    select r.rolname
      from pg_roles r, pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'lesson_body_is_servable'
       and has_function_privilege(r.oid, p.oid, 'EXECUTE')
       and not r.rolsuper
  loop
    execute format('grant execute on function mcp.lesson_withholding_reason(uuid) to %I', v_role);
  end loop;

  -- 2. THE VERDICT, NOW DERIVED. One predicate, one place.
  --
  --    `reason is null` ALONE IS WRONG, and it is wrong in the releasing
  --    direction. For an id that is not a lesson the reason function selects
  --    zero rows, returns NULL, and `NULL is null` is TRUE -- so a nonexistent
  --    lesson would come back SERVABLE. Today it returns NULL, which every
  --    caller treats as not-servable. The existence test keeps that.
  execute $fn2$
    create or replace function public.lesson_body_is_servable(p_lesson_id uuid)
     returns boolean
     language sql
     stable security definer
     set search_path to ''
    as $body2$
      select exists (select 1 from public.lessons where id = p_lesson_id)
         and mcp.lesson_withholding_reason(p_lesson_id) is null
    $body2$;
  $fn2$;

  -- 3. The reason travels to the caller. A COLUMN, so the deployed function
  --    that does not select it cannot notice.
  --
  --    BOTH COLUMNS CALL THE FUNCTION, AND THE LATERAL THAT AVOIDED THAT WAS
  --    REMOVED AFTER MEASURING. The draft wrapped the call in a CROSS JOIN
  --    LATERAL so the predicate ran once rather than twice per row, on the
  --    strength of a view query that took 67 ms for 35 rows -- about 1.9 ms a
  --    row, which would have made doubling it a real regression on a
  --    partner-facing catalogue call.
  --
  --    That number was the wrong number. Timed directly, 35 calls of
  --    `lesson_body_is_servable` execute in 3.6 ms -- ABOUT 0.1 ms EACH. The
  --    67 ms was planning and transport. So the saving was ~3 ms on a page, and
  --    the cost was a LATERAL whose position in the FROM clause the planner is
  --    free to evaluate before the certification join -- 1,437 rows instead of
  --    35, which is the regression it was written to prevent, larger.
  --
  --    An optimisation inside a query is a measurement error until measured,
  --    and this one was aimed at a cost that does not exist. The plain form
  --    preserves today's evaluation semantics exactly and cannot scan wide.
  --
  --    The existence test in 2 is redundant HERE, because a row of this view is
  --    a lesson by construction, so `reason is null` would be exact -- but it
  --    goes through the same function either way, so there is nothing to gain
  --    by writing a second spelling of the verdict into the view.
  execute $v$
    create or replace view mcp.lesson_index as
    SELECT c.code AS certification,
        m.slug AS module_slug,
        COALESCE(mt.title, m.title) AS module_title,
            CASE
                WHEN l.language = 'en'::text THEN false
                ELSE mt.title IS NULL
            END AS module_title_is_fallback,
        m.order_index AS module_order,
        l.slug AS lesson_slug,
        l.title AS lesson_title,
        l.language,
        l.lesson_group_id,
        l.order_index AS lesson_order,
        l.estimated_minutes,
        public.lesson_body_is_servable(l.id) AS body_available,
        mcp.lesson_withholding_reason(l.id) AS withholding_reason
       FROM public.lessons l
         JOIN public.modules m ON m.id = l.module_id
         JOIN public.certifications c ON c.id = m.certification_id
         LEFT JOIN public.module_translations mt ON mt.module_id = m.id
              AND mt.language = l.language AND mt.is_provisional = false
              AND mt.review_status = 'approved'::text
      WHERE c.code = ANY ('{AISM-I,AIE-I,AIHR-I,AIGRM-I,SM-AI-I,SM-AI-II,SPO-AI-I,SD-AI-I,ISMS-F,AIMS-F,AIMS-IA,ISMS-IA}'::text[])
  $v$;

  -- No grant here on purpose: `create or replace view` PRESERVES the ACL, and
  -- re-granting a typed pair is how a preserved set gets narrowed by accident.
  -- Asserted below instead.

  -- 4. POST-CONDITIONS, BOTH DIRECTIONS.

  -- NEGATIVE, AND IT IS THE ONE THAT MATTERS: deriving the verdict from the
  -- reason must move NOTHING. A row that changes servability means the reason
  -- function is not the predicate it was lifted from.
  select count(*), string_agg(l.slug || '/' || l.language, ', ')
    into v_moved, v_who
    from public.lessons l
   where (v_before ->> l.id::text)::boolean is distinct from public.lesson_body_is_servable(l.id);
  if v_moved <> 0 then
    raise exception 'servability moved on % row(s)', v_moved
      using detail = left(v_who, 300),
            hint = 'the reason is not the predicate it was lifted from';
  end if;

  -- NEGATIVE: the view still returns the same rows. Adding a column cannot
  -- change the count, which is exactly the kind of reasoning that has been
  -- wrong here before.
  select count(*) into v_rows_after from mcp.lesson_index;
  if v_rows_after <> v_rows_before then
    raise exception 'mcp.lesson_index went from % rows to %', v_rows_before, v_rows_after;
  end if;

  -- NEGATIVE: nobody lost the view, and nobody lost the function the view now
  -- delegates through. 365's defect, asserted rather than remembered.
  select string_agg(r.rolname, ', ' order by r.rolname) into v_acl_now
    from pg_roles r where has_table_privilege(r.oid, 'mcp.lesson_index'::regclass, 'SELECT');
  if v_acl_now is distinct from v_acl_view then
    raise exception 'mcp.lesson_index readers moved'
      using detail = 'now: ' || v_acl_now, hint = 'was: ' || v_acl_view;
  end if;
  select string_agg(r.rolname, ', ' order by r.rolname) into v_acl_now
    from pg_roles r, pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'mcp' and p.proname = 'lesson_withholding_reason'
     and has_function_privilege(r.oid, p.oid, 'EXECUTE');
  if v_acl_now is distinct from v_acl_fn then
    raise exception 'reason-function callers differ from servable callers'
      using detail = 'now: ' || left(v_acl_now, 300),
            hint = 'was: ' || left(v_acl_fn, 300) ||
                   ' -- if `now` is every role, PUBLIC was not revoked';
  end if;

  -- AND THE SAME PROPERTY STATED DIRECTLY, not only as a set comparison. The
  -- comparison above would also pass if BOTH functions were world-callable.
  -- This function reports WHY a body is withheld; anon has no business asking.
  if has_function_privilege('anon', 'mcp.lesson_withholding_reason(uuid)'::regprocedure, 'EXECUTE') then
    raise exception 'anon can call mcp.lesson_withholding_reason'
      using hint = 'revoke from public did not take';
  end if;
  -- The positive half, or the revoke could simply have removed everything.
  if not has_function_privilege('mcp_reader', 'mcp.lesson_withholding_reason(uuid)'::regprocedure, 'EXECUTE') then
    raise exception 'mcp_reader cannot call mcp.lesson_withholding_reason'
      using hint = 'the view it backs would 500 for the partner read role';
  end if;

  -- THE ONE INTENDED CHANGE, ASSERTED RATHER THAN MENTIONED: a nonexistent
  -- lesson returned NULL and now returns FALSE. Both are not-servable in every
  -- boolean context, and false is the honest one. It is named here so it cannot
  -- be discovered later as a surprise.
  if public.lesson_body_is_servable('00000000-0000-0000-0000-000000000000'::uuid) is distinct from false then
    raise exception 'a nonexistent lesson is not reporting false';
  end if;

  -- POSITIVE: every withheld row now carries a reason, and every servable row
  -- carries none. A reason that is null on a withheld row is the vacuous state.
  if exists (select 1 from mcp.lesson_index
              where body_available and withholding_reason is not null) then
    raise exception 'a servable row carries a withholding reason';
  end if;
  if exists (select 1 from mcp.lesson_index
              where not body_available and withholding_reason is null) then
    raise exception 'a withheld row carries no reason'
      using hint = 'the discriminator has a fourth state';
  end if;

  -- POSITIVE: all three reasons are reachable as a set, and the split is the
  -- measured one. A discriminator whose class is never populated is as
  -- suspicious as one that swallows everything.
  select count(*) filter (where withholding_reason = 'iso_reproduction'),
         count(*) filter (where withholding_reason = 'translation_review'),
         count(*) filter (where withholding_reason = 'provenance_stale')
    into v_iso, v_review, v_prov
    from mcp.lesson_index;
  if v_iso = 0 then
    raise exception 'no row reports iso_reproduction'
      using hint = 'the scanner arm is unreachable';
  end if;
  if v_review = 0 then
    raise exception 'no row reports translation_review'
      using hint = 'the arm this migration exists for is unreachable';
  end if;

  -- `provenance_stale` IS EMPTY, AND THAT IS REPORTED RATHER THAN ASSERTED
  -- AWAY. 367 landed yesterday and stamped every translated row against the
  -- English it was made from, so nothing has had the chance to go stale yet. An
  -- empty class is normally as suspicious as one that swallows everything --
  -- here it is expected, and the arm HAS been watched to fire: verify-367.mjs
  -- edits a live English body and both translations go dark through this exact
  -- predicate. So the class is VACUOUS, not unreachable, and the notice says
  -- which, because `3 reasons, one at zero` cannot.
  if v_prov <> 0 then
    raise notice '371: provenance_stale populated: % row(s)', v_prov;
  else
    raise notice '371: provenance_stale VACUOUS (0) -- expected; arm exercised by verify-367';
  end if;

  raise notice '371: iso %, review %, provenance %', v_iso, v_review, v_prov;
  raise notice '371: servability unchanged on every row; readers unchanged';
end
$mig$;

-- ############ APPLIED 2026-09-24, ATTEMPT 2 ############
--
-- Read back from pg_proc.prosrc and md5'd with CRs stripped, because this file
-- must record what RAN and not what was handed over. Both match this file
-- exactly -- the SQL was not edited in the editor:
--
--   mcp.lesson_withholding_reason    7e3b0fd5736445efddcdef34a85d53b7
--   public.lesson_body_is_servable   18b17a66dd60427876888a0dcba9c0b3
--
-- State after, read from the database rather than from the notices:
--
--   mcp.lesson_index rows                    1437   (unchanged)
--   iso_reproduction                            6
--   translation_review                        177
--   provenance_stale                            0   vacuous, see above
--   servable rows carrying a reason             0
--   withheld rows carrying no reason            0
--   anon can call the reason function       false
--   mcp_reader can call it                   true
--   roles that can call it                      7   == the outgoing function's 7
--
-- Verified on the wire with a partner key, BOTH DIRECTIONS:
--
--   AIMS-F 01-01-what-an-aims-is   es-419  404  translation_pending_review
--   AIMS-F 05-01-aims-monitoring.. en      404  body_withheld_standard_text
--
-- The second still names ISO, because for that row it is true. A refusal that
-- never mentions ISO would have passed a one-sided check while having simply
-- deleted the true message.

-- Read it back, as a separate statement.
select withholding_reason, count(*) as rows
  from mcp.lesson_index
 group by withholding_reason
 order by rows desc;
